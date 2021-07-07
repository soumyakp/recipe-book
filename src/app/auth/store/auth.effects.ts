import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, Effect, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { AuthService } from '../auth.service';
import { User } from '../user.model';
import {
  AuthActions,
  AUTHENTICATE_SUCCESS,
  AuthenticateSuccess,
  AuthenticateFail,
  LoginStart,
  LOGIN_START,
  SIGNUP_START,
  SignupStart,
  LOGOUT,
  AUTO_LOGIN
} from './auth.action';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

const handleAuthentication = (resData: any) => {
  const expirationDate = new Date(
    new Date().getTime() + +resData.expiresIn * 1000
  );
  const user = new User(
    resData.email,
    resData.localId,
    resData.idToken,
    expirationDate
  );
  localStorage.setItem('userData', JSON.stringify(user));
  return new AuthenticateSuccess({
    email: resData.email,
    userId: resData.localId,
    token: resData.idToken,
    expirationDate: expirationDate
  });
};

const handleError = (errorRes: any) => {
  let errorMessage = 'An unknown error occurred!';
  if (!errorRes.error || !errorRes.error.error) {
    return of(new AuthenticateFail(errorMessage));
  }
  switch (errorRes.error.error.message) {
    case 'EMAIL_EXISTS':
      errorMessage = 'This email exists already';
      break;
    case 'EMAIL_NOT_FOUND':
      errorMessage = 'This email does not exist.';
      break;
    case 'INVALID_PASSWORD':
      errorMessage = 'This password is not correct.';
      break;
  }
  return of(new AuthenticateFail(errorMessage));
};

@Injectable()
export class AuthEffects {
  authSignup = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SIGNUP_START),
        switchMap((signupAction: SignupStart) => {
          return this.http
            .post<AuthResponseData>(
              'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' +
                environment.firebaseAPIKey,
              {
                email: signupAction.payload.email,
                password: signupAction.payload.password,
                returnSecureToken: true
              }
            )
            .pipe(
              tap(resData => {
                this.authService.setLogoutTimer(+resData.expiresIn * 1000);
              }),
              map(resData => {
                return handleAuthentication(resData);
              }),
              catchError(errorRes => {
                return handleError(errorRes);
              })
            );
        })
      ) as any
  );

  authLogin = createEffect(
    () =>
      // @Effect()authLogin =
      this.actions$.pipe(
        ofType(LOGIN_START),
        switchMap((authDate: LoginStart) => {
          return this.http
            .post<AuthResponseData>(
              'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
                environment.firebaseAPIKey,
              {
                email: authDate.payload.email,
                password: authDate.payload.password,
                returnSecureToken: true
              }
            )
            .pipe(
              tap(resData => {
                this.authService.setLogoutTimer(+resData.expiresIn * 1000);
              }),
              map(resData => {
                return handleAuthentication(resData);
              }),
              catchError(errorRes => {
                return handleError(errorRes);
              })
            );
        })
      ) as any
  );

  authRedirect = createEffect(
    () =>
      this.actions$.pipe(
        // We can add two type checking...
        // ofType(AUTHENTICATE_SUCCESS, LOGOUT),
        ofType(AUTHENTICATE_SUCCESS),
        tap(() => {
          this.router.navigate(['/']);
        })
      ) as any,
    { dispatch: false }
  );

  autoLogin = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AUTO_LOGIN),
        map(() => {
          const userData = JSON.parse(
            localStorage.getItem('userData') as string
          );
          if (!userData) {
            return { type: 'DUMMY' };
          }

          const loadedUser = new User(
            userData.email,
            userData.id,
            userData._token,
            new Date(userData._tokenExpirationDate)
          );

          if (loadedUser.token) {
            const expirationDuration =
              new Date(userData._tokenExpirationDate).getTime() -
              new Date().getTime();
            this.authService.setLogoutTimer(expirationDuration);
            return new AuthenticateSuccess({
              email: userData.email,
              userId: userData.id,
              token: loadedUser.token,
              expirationDate: new Date(userData._tokenExpirationDate)
            });
          }
          return { type: 'DUMMY' };
        })
      ) as any
  );

  authLogout = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LOGOUT),
        tap(() => {
          this.authService.clearLogoutTimer();
          localStorage.removeItem('userData');
          this.router.navigate(['/auth']);
        })
      ) as any,
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}
}
