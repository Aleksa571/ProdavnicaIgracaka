import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FlightService } from '../services/flight.service';
import { Router, RouterLink } from "@angular/router";
import { MatSelectModule } from '@angular/material/select';
import { UserModel } from '../../models/user.model';
import { Alerts } from '../alerts';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    RouterLink,
    MatSelectModule
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  user: Partial<UserModel> = {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    password: '',
    destination: ''
  }

  repeat: string = ''
  destinations = signal<string[]>([])

  constructor(public router: Router) {
    FlightService.getDestinations()
      .then(rsp => this.destinations.set(rsp.data))
  }

  doSignup() {
    if (AuthService.existsByEmail(this.user.email!)) {
      Alerts.error('Email already registred!')
      return
    }

    if (this.user.firstName == '' || this.user.lastName == '' || this.user.address == '' || this.user.destination == '' || this.user.phone == '') {
      Alerts.error('All fields should have a value!')
      return
    }

    if (this.user.password!.length < 6) {
      Alerts.error('Password must be at least 6 chars long!')
      return
    }

    if (this.user.password !== this.repeat) {
      Alerts.error('Passwords dont match!')
      return
    }

    console.log(this.user)
    AuthService.createUser(this.user)
    this.router.navigate(['/login'])
  }
}