import { Component, signal } from '@angular/core';
import axios from 'axios';
import { FlightModel } from '../../models/flight.model';
import { RouterLink } from "@angular/router";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Utils } from '../utils';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  flights = signal<FlightModel[]>([])

  constructor(public utils: Utils) {
    localStorage.setItem('time', new Date().toISOString());
    axios.get<FlightModel[]>('https://flight.pequla.com/api/flight/list?type=departure')
      .then(rsp => {
        const sorted = rsp.data.sort((f1, f2) => new Date(f1.scheduledAt).getTime() - new Date(f2.scheduledAt).getTime())
        this.flights.set(sorted)
      })
  }
}
 