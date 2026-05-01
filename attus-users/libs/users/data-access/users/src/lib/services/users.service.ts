import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = 'https://jsonplaceholder.typicode.com/users';

  constructor(private http: HttpClient) {}

  getUsers(page: number, limit: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}?_page=${page}&_limit=${limit}`);
  }

  createUser(user: User) {
    return this.http.post(this.api, user);
  }
}
