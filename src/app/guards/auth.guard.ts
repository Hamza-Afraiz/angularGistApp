import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const isLoggedIn = false; // set your logic here
  if (!isLoggedIn) {
    alert('Access denied - please log in');
    return false;
  }
  return true;
};
