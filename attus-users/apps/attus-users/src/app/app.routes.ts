import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('@attus-users/users').then((m) => m.featureUsersRoutes),
  },
];
