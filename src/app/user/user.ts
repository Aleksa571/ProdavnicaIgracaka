import { Component, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FlightService } from '../services/flight.service';
import { Loading } from '../loading/loading';
import { Alerts } from '../alerts';
import { FlightModel } from '../../models/flight.model';
import { MatListModule } from '@angular/material/list';
import { Utils } from '../utils';

@Component({
  selector: 'app-user',
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatListModule,
    MatSelectModule,
    Loading,
    RouterLink
],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {
  public activeUser = AuthService.getActiveUser()
  destinations = signal<string[]>([])
  recommended = signal<FlightModel[]>([])
  oldPassword = ''
  newPassword = ''
  passRepeat = ''

  constructor(private router: Router, public utils: Utils) {
    if (!AuthService.getActiveUser()) {
      router.navigate(['/login'])
      return
    }

    FlightService.getDestinations()
      .then(rsp => this.destinations.set(rsp.data))

    FlightService.getFlightsToDestination(this.activeUser!.destination)
      .then(rsp => this.recommended.set(rsp.data.content))
  }

  getAvatarUrl() {
    return `https://ui-avatars.com/api/?name=${this.activeUser?.firstName}+${this.activeUser?.lastName}`
  }

  updateUser() {
    Alerts.confirm('Are you sure you want to update user info?',
      () => {
        AuthService.updateActiveUser(this.activeUser!)
        Alerts.success('User updated successfully')
      })
  }

  updatePassword() {
    Alerts.confirm('Are you sure you want to change the password?',
      () => {
        if (this.oldPassword != this.activeUser?.password) {
          Alerts.error('Invalid old password')
          return
        }

        if (this.newPassword.length < 6) {
          Alerts.error('Password must be at least 6 characters long')
          return
        }

        if (this.newPassword != this.passRepeat) {
          Alerts.error('Passwords dont match')
          return
        }

        if (this.newPassword == this.activeUser?.password) {
          Alerts.error('New password cant be the same as the old one')
          return
        }

        AuthService.updateActiveUserPassword(this.newPassword)
        Alerts.success('Password updated successfuly')
        AuthService.logout()
        this.router.navigate(['/login'])
      })
  }
}