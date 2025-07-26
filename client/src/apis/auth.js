import axios from "../config/axios";

export const apiRegister = async (data) =>
	axios({
		method: "POST",
		url: `/auth/register`,
		data,
		withCredentials: true,
	});

export const apiLogin = async (data) =>
	axios({
		method: "POST",
		url: `/auth/login`,
		data,
		withCredentials: true,
	});

export const apiLogout = async () =>
	axios({
		method: "POST",
		url: `/auth/logout`,
		withCredentials: true,
	});