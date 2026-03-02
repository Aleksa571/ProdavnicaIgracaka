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

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, Loading],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  public authService = AuthService
  flights = signal<FlightModel[]>([])

  constructor(public utils: Utils) {
    FlightService.getFlights()
      .then(rsp => {
        const sorted = rsp.data.sort((f1, f2) => new Date(f1.scheduledAt).getTime() - new Date(f2.scheduledAt).getTime())
        this.flights.set(sorted)
      })
  }
}