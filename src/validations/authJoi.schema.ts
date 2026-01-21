import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  userName: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().optional().allow(null, ''),
  password: Joi.string().min(6).required(),
  surname: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
  birthDate: Joi.date().max('now').required()
});

export const loginSchema = Joi.object({
  userName: Joi.string().required(),
  password: Joi.string().required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});