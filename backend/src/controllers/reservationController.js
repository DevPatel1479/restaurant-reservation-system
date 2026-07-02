import { Reservation } from '../models/Reservation.js';
import { Table } from '../models/Table.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { buildTimeSlotLabel, normalizeDate, overlaps, toMinutes, validateRestaurantHours } from '../utils/time.js';

const isAdmin = (user) => user.role === 'admin';

const pickTableForReservation = async ({ guests, date, startTime, endTime, preferredTableId = null, reservationIdToIgnore = null }) => {
  const query = { isActive: true, capacity: { $gte: guests } };
  const candidates = preferredTableId ? await Table.find({ _id: preferredTableId, ...query }) : await Table.find(query).sort({ capacity: 1, name: 1 });

  if (!candidates.length) {
    throw new ApiError(409, 'No table can accommodate the requested number of guests');
  }

  const existingReservations = await Reservation.find({
    date,
    status: 'confirmed',
    ...(reservationIdToIgnore ? { _id: { $ne: reservationIdToIgnore } } : {})
  }).lean();

  const requestedStart = toMinutes(startTime);
  const requestedEnd = toMinutes(endTime);

  const availableTable = candidates.find((table) => {
    const conflicts = existingReservations.some((reservation) => {
      if (reservation.table.toString() !== table._id.toString()) return false;
      return overlaps(requestedStart, requestedEnd, toMinutes(reservation.startTime), toMinutes(reservation.endTime));
    });
    return !conflicts;
  });

  if (!availableTable) {
    throw new ApiError(409, 'No available table for that time slot');
  }

  return availableTable;
};

const buildReservationResponse = (reservation) => reservation;

export const createReservation = async (req, res, next) => {
  try {
    const actor = req.user;
    const { date, startTime, endTime, guests, tableId = null, notes = '' } = req.body;

    normalizeDate(date);
    validateRestaurantHours(startTime, endTime);

    const table = await pickTableForReservation({ guests, date, startTime, endTime, preferredTableId: tableId });

    const reservation = await Reservation.create({
      user: actor.sub,
      table: table._id,
      date,
      startTime,
      endTime,
      guests,
      notes,
      status: 'confirmed',
      createdBy: actor.sub,
      updatedBy: actor.sub
    });

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: { reservation: buildReservationResponse(reservation) }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user.sub })
      .populate('table', 'name capacity isActive')
      .sort({ date: -1, startTime: -1 });
    res.json({ success: true, data: { reservations } });
  } catch (error) {
    next(error);
  }
};

export const listReservations = async (req, res, next) => {
  try {
    const { date, status, userId } = req.query;
    const filter = {};
    if (date) filter.date = date;
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const reservations = await Reservation.find(filter)
      .populate('user', 'name email role')
      .populate('table', 'name capacity isActive')
      .sort({ date: -1, startTime: -1 });

    res.json({ success: true, data: { reservations } });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('table', 'name capacity isActive');
    if (!reservation) throw new ApiError(404, 'Reservation not found');

    const owned = reservation.user._id.toString() === req.user.sub;
    if (!owned && !isAdmin(req.user)) {
      throw new ApiError(403, 'Forbidden');
    }

    res.json({ success: true, data: { reservation } });
  } catch (error) {
    next(error);
  }
};

export const updateReservation = async (req, res, next) => {
  try {
    const { date, startTime, endTime, guests, tableId, status, userId, notes } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new ApiError(404, 'Reservation not found');

    if (!isAdmin(req.user) && reservation.user.toString() !== req.user.sub) {
      throw new ApiError(403, 'Forbidden');
    }

    const nextDate = date ?? reservation.date;
    const nextStartTime = startTime ?? reservation.startTime;
    const nextEndTime = endTime ?? reservation.endTime;
    const nextGuests = guests ?? reservation.guests;
    const nextTableId = tableId ?? reservation.table.toString();

    normalizeDate(nextDate);
    validateRestaurantHours(nextStartTime, nextEndTime);

    const table = await pickTableForReservation({
      guests: nextGuests,
      date: nextDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      preferredTableId: nextTableId,
      reservationIdToIgnore: reservation._id
    });

    reservation.date = nextDate;
    reservation.startTime = nextStartTime;
    reservation.endTime = nextEndTime;
    reservation.guests = nextGuests;
    reservation.table = table._id;
    if (typeof notes === 'string') reservation.notes = notes;
    if (isAdmin(req.user) && userId) {
      const user = await User.findById(userId);
      if (!user) throw new ApiError(404, 'User not found');
      reservation.user = user._id;
    }
    if (status) reservation.status = status;
    reservation.updatedBy = req.user.sub;
    await reservation.save();

    const populated = await Reservation.findById(reservation._id)
      .populate('user', 'name email role')
      .populate('table', 'name capacity isActive');

    res.json({
      success: true,
      message: 'Reservation updated',
      data: { reservation: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new ApiError(404, 'Reservation not found');

    if (!isAdmin(req.user) && reservation.user.toString() !== req.user.sub) {
      throw new ApiError(403, 'Forbidden');
    }

    reservation.status = 'cancelled';
    reservation.updatedBy = req.user.sub;
    await reservation.save();

    res.json({ success: true, message: 'Reservation cancelled' });
  } catch (error) {
    next(error);
  }
};

export const reservationStats = async (_req, res, next) => {
  try {
    const [total, confirmed, cancelled] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: 'confirmed' }),
      Reservation.countDocuments({ status: 'cancelled' })
    ]);
    res.json({ success: true, data: { total, confirmed, cancelled, timeSlotExample: buildTimeSlotLabel('18:00', '19:30') } });
  } catch (error) {
    next(error);
  }
};
