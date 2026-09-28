// Imports Angular's CanActivateFn type for route guards and Router for redirecting users.
import {CanActivateFn, Router} from '@angular/router';

// Imports inject so the route guards can access Angular services without a constructor.
import {inject} from '@angular/core';


// Protects routes that require a logged-in user.
export const authGuard: CanActivateFn = (_route, state) => {

    // Gets the Angular Router service.
    const router = inject(Router);

    // Checks whether a logged-in user's ID is stored in local storage.
    if (localStorage.getItem('userId')) {
        // Allows the user to access the requested route.
        return true;
    }

    // Redirects unauthenticated users to the login page and remembers the page they originally requested.
    return router.createUrlTree(
        ['/login'],
        {
            queryParams: {
                returnUrl: state.url
            }
        }
    );

};


// Protects routes that require the super-admin role.
export const superAdminGuard: CanActivateFn = () => {

    // Gets the Angular Router service.
    const router = inject(Router);

    // Checks whether the current user has the super-admin role.
    if (localStorage.getItem('role') === 'super-admin') {
        // Allows the super administrator to access the requested route.
        return true;
    }

    // Redirects users without the super-admin role to the regular user dashboard.
    return router.createUrlTree(['/user']);

};


// Protects routes that are only available while the user is in guest mode.
export const guestGuard: CanActivateFn = () => {

    // Gets the Angular Router service.
    const router = inject(Router);

    // Checks whether guest mode is currently enabled in local storage.
    if (localStorage.getItem('guest') === 'true') {
        // Allows the guest user to access the requested route.
        return true;
    }

    // Redirects users who are not in guest mode to the login page.
    return router.createUrlTree(['/login']);

};