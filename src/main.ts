import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import { NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
(window as any).monacoBasePath = 'assets/monaco';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([AuthInterceptor])),
    importProvidersFrom(RouterModule.forRoot(routes)),
    provideAnimationsAsync(),

    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useValue: {
        baseUrl: 'assets/monaco',
        defaultOptions: { scrollBeyondLastLine: false },
      },
    },
  ],
});
