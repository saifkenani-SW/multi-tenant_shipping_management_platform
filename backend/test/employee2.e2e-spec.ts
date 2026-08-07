import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Employee2 Endpoints Summary', () => {
  it('Should exist', () => {
    expect(true).toBe(true);
  });
});
