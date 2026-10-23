import {
    IsEmail,
    IsString,
    MaxLength,
    MinLength,
  } from 'class-validator';
  
  export class RegistroUsuarioDto {
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    nombre!: string;
  
    @IsEmail()
    @MaxLength(254)
    correo!: string;
  
    @IsString()
    @MinLength(12)
    @MaxLength(128)
    password!: string;
  }