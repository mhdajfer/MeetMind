import Joi from "joi";

export const oauthAuthSchema = Joi.object({
  token: Joi.string().required(),
});

