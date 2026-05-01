import { Route } from '@angular/router';
import { UsersListComponent } from './lib/pages/users-list/users-list.component';
import { UsersFormComponent } from './lib/pages/users-form/users-form.component';

export const featureUsersRoutes: Route[] = [
  { path: '', component: UsersListComponent },
  { path: 'novo', component: UsersFormComponent },
];
