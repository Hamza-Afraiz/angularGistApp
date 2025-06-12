// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = 'token_here';

  const authReq = req.clone({
    headers: req.headers
      .set('Authorization', `token ${token}`)
      .set('Accept', 'application/vnd.github.v3+json'),
  });

  return next(authReq);
};
