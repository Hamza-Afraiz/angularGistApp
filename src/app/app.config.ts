import {
  ApplicationConfig,
  InjectionToken,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MonacoEditorModule, NgxMonacoEditorConfig } from 'ngx-monaco-editor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // Import provideAnimationsAsync
import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';

declare const NGX_MONACO_EDITOR_CONFIG: InjectionToken<NgxMonacoEditorConfig>;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])), // ✅ Correct usage for HttpInterceptorFn
    MonacoEditorModule.forRoot().providers!,
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useValue: {
        baseUrl: 'assets/monaco',
      } as NgxMonacoEditorConfig,
    },
    provideAnimationsAsync(),
  ],
};

