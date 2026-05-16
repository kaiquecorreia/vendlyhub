import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Patch,
  UnauthorizedException,
  Res,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContactType, OwnerType } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AVATARS_UPLOAD_DIR, LOGOS_UPLOAD_DIR } from '../../../upload-paths';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from '../dto/register.dto';
import { RegisterMinimalDto } from '../dto/register-minimal.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegisterUserUseCase } from '../use-cases/register-user.usecase';
import { RequestPasswordResetUseCase } from '../use-cases/request-password-reset.usecase';
import { ResetPasswordUseCase } from '../use-cases/reset-password.usecase';
import { LoginUserUseCase } from '../use-cases/login-user.usecase';
import { RefreshAccessTokenUseCase } from '../use-cases/refresh-access-token.usecase';
import { LogoutUserUseCase } from '../use-cases/logout-user.usecase';
import { GoogleAuthUseCase } from '../use-cases/google-auth.usecase';
import { LoginWithTokenUseCase } from '../use-cases/login-with-token.usecase';
import { UsersService } from '../../users/services/users.service';
import { EstablishmentsService } from '../../establishments/services/establishments.service';
import { AddressesService } from '../../addresses/services/addresses.service';
import { ContactsService } from '../../contacts/services/contacts.service';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { UpdateEstablishmentDto } from '../dto/update-establishment.dto';
import { UpdateEstablishmentPixDto } from '../dto/update-establishment-pix.dto';
import { Establishment } from '../../establishments/entities/establishment.entity';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
    private logoutUserUseCase: LogoutUserUseCase,
    private googleAuthUseCase: GoogleAuthUseCase,
    private loginWithTokenUseCase: LoginWithTokenUseCase,
    private requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private usersService: UsersService,
    private establishmentsService: EstablishmentsService,
    private addressesService: AddressesService,
    private contactsService: ContactsService,
    private transactionService: TransactionService,
    private prismaService: PrismaService,
  ) {}

  private async buildEstablishmentPayload(establishment: Establishment | null) {
    if (!establishment) return undefined;
    const address = await this.addressesService.findById(
      establishment.addressId,
    );
    const contacts = await this.contactsService.findByOwnerId(
      establishment.establishmentId,
      OwnerType.establishment,
    );
    let phone_number: string | undefined;
    let mobile_number: string | undefined;
    for (const c of contacts) {
      if (c.contactType === ContactType.phone_number) phone_number = c.value;
      if (c.contactType === ContactType.mobile_number) mobile_number = c.value;
    }
    return {
      establishmentId: establishment.establishmentId,
      name: establishment.name,
      document: establishment.document,
      documentType: establishment.documentType,
      onboardingStatus: establishment.onboardingStatus,
      establishmentTypes: establishment.establishmentTypes,
      pixCopyPaste: establishment.pixCopyPaste ?? undefined,
      logo: establishment.logo ?? undefined,
      address: address
        ? {
            addressId: address.addressId,
            cep: address.cep ?? undefined,
            street: address.street ?? undefined,
            number: address.number ?? undefined,
            complement: address.complement ?? undefined,
            neighborhood: address.neighborhood ?? undefined,
            city: address.city ?? undefined,
            state: address.state ?? undefined,
          }
        : undefined,
      phone_number,
      mobile_number,
    };
  }

  private async completeOnboardingForUser(
    req: { user: { userId: string } },
    dto: UpdateEstablishmentDto,
    file?: Express.Multer.File,
  ) {
    const establishment = await this.establishmentsService.findByUserId(
      req.user.userId,
    );
    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }
    const logo = file ? `/uploads/logos/${file.filename}` : undefined;

    try {
      await this.transactionService.run(async () => {
        await this.addressesService.update(establishment.addressId, {
          cep: dto.cep,
          street: dto.street,
          number: dto.number,
          complement: dto.complement,
          neighborhood: dto.neighborhood,
          city: dto.city,
          state: dto.state,
        });
        await this.establishmentsService.update(establishment.establishmentId, {
          name: dto.establishmentName,
          document: dto.document,
          documentType: dto.documentType,
          establishmentTypeNames: dto.establishmentTypes,
          pixCopyPaste: dto.pixCopyPaste,
          onboardingStatus: 'completed',
          ...(logo ? { logo } : {}),
        });
        await this.prismaService.getClient().userEstablishment.updateMany({
          where: {
            userId: req.user.userId,
            establishmentId: establishment.establishmentId,
          },
          data: {
            minimalProfileCompleted: true,
          },
        });
        await this.contactsService.upsertEstablishmentContacts(
          establishment.establishmentId,
          dto.phone_number,
          dto.mobile_number,
        );
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Documento já cadastrado');
      }
      throw e;
    }

    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new UnauthorizedException('User not found');
    const updatedEst = await this.establishmentsService.findByUserId(
      req.user.userId,
    );
    const userLink = await this.prismaService
      .getClient()
      .userEstablishment.findFirst({
        where: { userId: user.userId },
      });
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar || undefined,
      whatsapp: userLink?.loginWhatsapp,
      minimalProfileCompleted:
        userLink?.minimalProfileCompleted ??
        (updatedEst
          ? updatedEst.onboardingStatus === 'minimal_completed' ||
            updatedEst.onboardingStatus === 'completed'
          : false),
      establishment: updatedEst
        ? await this.buildEstablishmentPayload(updatedEst)
        : undefined,
    };
  }

  @Post('register')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: LOGOS_UPLOAD_DIR,
        filename: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (
        req: Express.Request,
        file: Express.Multer.File,
        cb: (error: Error | null, accepted: boolean) => void,
      ) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async register(
    @Body() dto: RegisterDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto.logo = `/uploads/logos/${file.filename}`;
    }
    const { tokens } = await this.registerUserUseCase.execute(dto);
    if (tokens) {
      return tokens;
    }
    return { message: 'User registered successfully' };
  }

  @Post('register-minimal')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: LOGOS_UPLOAD_DIR,
        filename: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (
        req: Express.Request,
        file: Express.Multer.File,
        cb: (error: Error | null, accepted: boolean) => void,
      ) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async registerMinimal(
    @Body() dto: RegisterMinimalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      dto.logo = `/uploads/logos/${file.filename}`;
    }
    const { tokens } = await this.registerUserUseCase.executeMinimal(dto);
    return tokens;
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.loginUserUseCase.execute({
      email: body.email,
      whatsapp: body.whatsapp,
      password: body.password,
    });
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.requestPasswordResetUseCase.execute(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto.token, dto.password);
  }

  @Post('refresh')
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token is required');
    return this.refreshAccessTokenUseCase.execute(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token is required');
    await this.logoutUserUseCase.execute(refreshToken);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: { user: { userId: string } }) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new UnauthorizedException('User not found');
    const establishment = await this.establishmentsService.findByUserId(
      user.userId,
    );
    const userLink = await this.prismaService
      .getClient()
      .userEstablishment.findFirst({
        where: { userId: user.userId },
      });
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar || undefined,
      whatsapp: userLink?.loginWhatsapp,
      minimalProfileCompleted:
        userLink?.minimalProfileCompleted ??
        (establishment
          ? establishment.onboardingStatus === 'minimal_completed' ||
            establishment.onboardingStatus === 'completed'
          : false),
      establishment: establishment
        ? await this.buildEstablishmentPayload(establishment)
        : undefined,
    };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: AVATARS_UPLOAD_DIR,
        filename: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (
        req: Express.Request,
        file: Express.Multer.File,
        cb: (error: Error | null, accepted: boolean) => void,
      ) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @Patch('me')
  async patchMe(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const avatar = file ? `/uploads/avatars/${file.filename}` : undefined;
    const user = await this.usersService.updateProfile(req.user.userId, {
      ...dto,
      ...(avatar ? { avatar } : {}),
    });
    const establishment = await this.establishmentsService.findByUserId(
      user.userId,
    );
    const userLink = await this.prismaService
      .getClient()
      .userEstablishment.findFirst({
        where: { userId: user.userId },
      });
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar || undefined,
      whatsapp: userLink?.loginWhatsapp,
      minimalProfileCompleted:
        userLink?.minimalProfileCompleted ??
        (establishment
          ? establishment.onboardingStatus === 'minimal_completed' ||
            establishment.onboardingStatus === 'completed'
          : false),
      establishment: establishment
        ? await this.buildEstablishmentPayload(establishment)
        : undefined,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('establishment/pix')
  async patchEstablishmentPix(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateEstablishmentPixDto,
  ) {
    const establishment = await this.establishmentsService.findByUserId(
      req.user.userId,
    );
    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }

    const normalizedPix =
      dto.pixCopyPaste?.trim() === '' ? null : dto.pixCopyPaste?.trim();
    await this.establishmentsService.update(establishment.establishmentId, {
      pixCopyPaste: normalizedPix,
    });

    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new UnauthorizedException('User not found');
    const updatedEst = await this.establishmentsService.findByUserId(
      req.user.userId,
    );
    const userLink = await this.prismaService
      .getClient()
      .userEstablishment.findFirst({
        where: { userId: user.userId },
      });
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar || undefined,
      whatsapp: userLink?.loginWhatsapp,
      minimalProfileCompleted:
        userLink?.minimalProfileCompleted ??
        (updatedEst
          ? updatedEst.onboardingStatus === 'minimal_completed' ||
            updatedEst.onboardingStatus === 'completed'
          : false),
      establishment: updatedEst
        ? await this.buildEstablishmentPayload(updatedEst)
        : undefined,
    };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: LOGOS_UPLOAD_DIR,
        filename: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (
        req: Express.Request,
        file: Express.Multer.File,
        cb: (error: Error | null, accepted: boolean) => void,
      ) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @Patch('establishment/logo')
  async patchEstablishmentLogo(
    @Request() req: { user: { userId: string } },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const establishment = await this.establishmentsService.findByUserId(
      req.user.userId,
    );
    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }
    if (!file) {
      throw new NotFoundException('Logo file is required');
    }
    const logo = `/uploads/logos/${file.filename}`;
    await this.establishmentsService.update(establishment.establishmentId, {
      logo,
    });

    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new UnauthorizedException('User not found');
    const updatedEst = await this.establishmentsService.findByUserId(
      req.user.userId,
    );
    const userLink = await this.prismaService
      .getClient()
      .userEstablishment.findFirst({
        where: { userId: user.userId },
      });
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatar: user.avatar || undefined,
      whatsapp: userLink?.loginWhatsapp,
      minimalProfileCompleted:
        userLink?.minimalProfileCompleted ??
        (updatedEst
          ? updatedEst.onboardingStatus === 'minimal_completed' ||
            updatedEst.onboardingStatus === 'completed'
          : false),
      establishment: updatedEst
        ? await this.buildEstablishmentPayload(updatedEst)
        : undefined,
    };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: LOGOS_UPLOAD_DIR,
        filename: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (
        req: Express.Request,
        file: Express.Multer.File,
        cb: (error: Error | null, accepted: boolean) => void,
      ) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @Patch('establishment')
  async patchEstablishment(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateEstablishmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.completeOnboardingForUser(req, dto, file);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: LOGOS_UPLOAD_DIR,
        filename: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (
        req: Express.Request,
        file: Express.Multer.File,
        cb: (error: Error | null, accepted: boolean) => void,
      ) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  @Post('onboarding/complete')
  async completeOnboarding(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateEstablishmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.completeOnboardingForUser(req, dto, file);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Request() req: { user: { email: string; name: string; id: string } },
    @Res() res: Response,
  ) {
    const { email, name, id: providerId } = req.user;
    if (!email || !name || !providerId)
      throw new UnauthorizedException('Invalid Google authentication data');
    try {
      const user = await this.googleAuthUseCase.execute(
        email,
        name,
        providerId,
      );
      const loginResult = await this.loginWithTokenUseCase.execute(user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(
        `${frontendUrl}/auth/callback?access_token=${loginResult.access_token}&refresh_token=${loginResult.refresh_token}`,
      );
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
}
