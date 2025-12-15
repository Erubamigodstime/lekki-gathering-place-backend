import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';

const authService = new AuthService();

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    ResponseUtil.created(res, 'Registration successful', result);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const result = await authService.login(req.body, userAgent, ipAddress);

    ResponseUtil.success(res, 'Login successful', result);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    ResponseUtil.success(res, 'Token refreshed successfully', result);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    ResponseUtil.success(res, 'Logout successful');
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    ResponseUtil.success(res, result.message);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    ResponseUtil.success(res, result.message);
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    ResponseUtil.success(res, result.message);
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    ResponseUtil.success(res, 'Profile retrieved successfully', user);
  });
}
