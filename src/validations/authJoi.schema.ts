import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  surname: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
  birthDate: Joi.date().max('now').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});