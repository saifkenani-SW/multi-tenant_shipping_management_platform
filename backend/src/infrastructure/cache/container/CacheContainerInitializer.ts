import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CacheContainer } from './CacheContainer';

@Injectable()
export class CacheContainerInitializer implements OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit(): void {
    CacheContainer.setModuleRef(this.moduleRef);
  }
}
