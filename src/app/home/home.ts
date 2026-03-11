import { Component, signal } from '@angular/core';
import { FlightModel } from '../../models/flight.model';
import { RouterLink } from "@angular/router";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Utils } from '../utils';
import { AuthService } from '../services/auth.service';
import { FlightService } from '../services/flight.service';
import { Loading } from '../loading/loading';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    Loading,
    MatInputModule,
    FormsModule,
    MatSelectModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  search = ''
  destination = ''
  fromDate = ''
  toDate = ''
  public authService = AuthService
  flights = signal<FlightModel[]>([])

  constructor(public utils: Utils) {
    FlightService.getFlights()
      .then(rsp => {
        const sorted = rsp.data.sort((f1, f2) => new Date(f1.scheduledAt).getTime() - new Date(f2.scheduledAt).getTime())
        this.flights.set(sorted)
        const allDates = this.getAvilableDates()
        this.fromDate = allDates[0]
        this.toDate = allDates[allDates.length - 1]
      })
  }

  getDestinations() {
    return this.flights().map(f => f.destination)
  }

  getAvilableDates() {
    const dates = new Set<string>()
    for (let f of this.flights()) {
      dates.add(f.scheduledAt.split('T')[0])
    }
    return Array.of(...dates)
  }
}
 