import * as festivalService from '../services/festival.service.js';
import { success } from '../utils/response.js';

export async function listFestivals(req, res, next) {
  try {
    const data = await festivalService.listFestivals(req.query, req.user || null);
    return success(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getFestivalDetail(req, res, next) {
  try {
    const data = await festivalService.getFestivalDetail(
      req.params.id,
      req.query,
      req.user || null,
    );
    return success(res, data);
  } catch (error) {
    next(error);
  }
}
