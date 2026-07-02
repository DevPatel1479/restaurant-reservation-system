import { Table } from '../models/Table.js';
import { ApiError } from '../utils/apiError.js';

export const listTables = async (_req, res, next) => {
  try {
    const tables = await Table.find().sort({ capacity: 1, name: 1 });
    res.json({ success: true, data: { tables } });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, message: 'Table created', data: { table } });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new ApiError(409, 'Table name already exists'));
    }
    next(error);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!table) throw new ApiError(404, 'Table not found');
    res.json({ success: true, message: 'Table updated', data: { table } });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) throw new ApiError(404, 'Table not found');
    res.json({ success: true, message: 'Table deleted', data: { table } });
  } catch (error) {
    next(error);
  }
};
