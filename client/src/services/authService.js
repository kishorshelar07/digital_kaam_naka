/**
 * ================================================================
 * services/authService.js — Authentication API Calls
 * UPDATED: Added checkUser() and loginWithPassword()
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */
import api from './api';

export const authService = {
  checkUser:        (phone)                       => api.post('/auth/check-user',      { phone }),
  sendOtp:          (phone)                       => api.post('/auth/send-otp',        { phone }),
  verifyOtp:        (phone, otp)                  => api.post('/auth/verify-otp',      { phone, otp }),
  loginWithPassword:(phone, password)             => api.post('/auth/login-password',  { phone, password }),
  forgotPassword:   (phone)                       => api.post('/auth/forgot-password', { phone }),
  resetPassword:    (phone, otp, newPassword)     => api.post('/auth/reset-password',  { phone, otp, newPassword }),
  register:         (formData)                    => api.post('/auth/register',         formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  logout:           ()                            => api.post('/auth/logout'),
  getMe:            ()                            => api.get('/auth/me'),
  refreshToken:     ()                            => api.post('/auth/refresh-token'),
};

/**
 * ================================================================
 * services/workerService.js — Worker API Calls
 * ================================================================
 */
export const workerService = {
  getAll:           (params)            => api.get('/workers',                    { params }),
  getNearby:        (params)            => api.get('/workers/nearby',             { params }),
  getById:          (id)                => api.get(`/workers/${id}`),
  update:           (id, data)          => api.put(`/workers/${id}`,              data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  setAvailability:  (data)              => api.post('/workers/availability',       data),
  getBookings:      (id, params)        => api.get(`/workers/${id}/bookings`,      { params }),
  getEarnings:      (id)                => api.get(`/workers/${id}/earnings`),
  getReviews:       (id, params)        => api.get(`/workers/${id}/reviews`,       { params }),
};

/**
 * ================================================================
 * services/employerService.js — Employer API Calls
 * ================================================================
 */
export const employerService = {
  getById:          (id)                => api.get(`/employers/${id}`),
  update:           (id, data)          => api.put(`/employers/${id}`,            data),
  getBookings:      (id, params)        => api.get(`/employers/${id}/bookings`,   { params }),
};

/**
 * ================================================================
 * services/jobService.js — Job Post API Calls
 * ================================================================
 */
export const jobService = {
  getAll:           (params)            => api.get('/jobs',                       { params }),
  getNearby:        (params)            => api.get('/jobs/nearby',                { params }),
  getById:          (id)                => api.get(`/jobs/${id}`),
  create:           (data)              => api.post('/jobs',                       data),
  update:           (id, data)          => api.put(`/jobs/${id}`,                 data),
  cancel:           (id)                => api.delete(`/jobs/${id}`),
  getCategories:    ()                  => api.get('/categories'),
};

/**
 * ================================================================
 * services/bookingService.js — Booking API Calls
 * ================================================================
 */
export const bookingService = {
  create:           (data)              => api.post('/bookings',                  data),
  getAll:           (params)            => api.get('/bookings',                   { params }),
  getById:          (id)                => api.get(`/bookings/${id}`),
  accept:           (id)                => api.put(`/bookings/${id}/accept`),
  reject:           (id, reason)        => api.put(`/bookings/${id}/reject`,      { reason }),
  start:            (id, loc)           => api.put(`/bookings/${id}/start`,       loc),
  complete:         (id)                => api.put(`/bookings/${id}/complete`),
  cancel:           (id, reason)        => api.put(`/bookings/${id}/cancel`,      { reason }),
};

/**
 * ================================================================
 * services/paymentService.js — Payment API Calls
 * ================================================================
 */
export const paymentService = {
  createOrder:      (bookingId)         => api.post('/payments/create-order',     { bookingId }),
  verify:           (data)              => api.post('/payments/verify',            data),
  confirmCash:      (bookingId)         => api.post('/payments/confirm-cash',      { bookingId }),
  getHistory:       (params)            => api.get('/payments/history',            { params }),
};

/**
 * ================================================================
 * services/ratingService.js — Rating API Calls
 * ================================================================
 */
export const ratingService = {
  submit:           (data)              => api.post('/ratings',                   data),
  getWorkerRatings: (id, params)        => api.get(`/ratings/worker/${id}`,       { params }),
  getEmployerRatings:(id, params)       => api.get(`/ratings/employer/${id}`,     { params }),
};

/**
 * ================================================================
 * services/notificationService.js — Notification API Calls
 * ================================================================
 */
export const notificationService = {
  getAll:           (params)            => api.get('/notifications',              { params }),
  markAllRead:      ()                  => api.put('/notifications/read-all'),
  markOneRead:      (id)                => api.put(`/notifications/${id}/read`),
};

/**
 * ================================================================
 * services/locationService.js — Location API Calls
 * ================================================================
 */
export const locationService = {
  getDistricts:     (state)             => api.get('/locations/districts',        { params: { state } }),
  getTalukas:       (district)          => api.get('/locations/talukas',          { params: { district } }),
  search:           (q)                 => api.get('/locations/search',           { params: { q } }),
};