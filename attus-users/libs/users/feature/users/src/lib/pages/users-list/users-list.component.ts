import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '@attus-users/ui';
import { UsersService } from '@attus-users/data-access-users';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, UiCardComponent],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent {
  page = 1;
  limit = 5;
  users: any[] = [];
  loading = false;

  constructor(private usersService: UsersService) {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;

    this.usersService.getUsers(this.page, this.limit).subscribe({
      next: (res) => {
        this.users = res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  nextPage() {
    this.page++;
    this.loadUsers();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }
}
