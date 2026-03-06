import { Component, signal } from '@angular/core';
import { FlightModel } from '../../models/flight.model';
import { DataService } from '../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FlightService } from '../services/flight.service';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Loading } from '../loading/loading';
import { Utils } from '../utils';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField, MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OrderModel } from '../../models/order.model';
import { AuthService } from '../services/auth.service';
import { Alerts } from '../alerts';

@Component({
  selector: 'app-order',
  imports: [
    MatCardModule,
    FormsModule,
    MatFormField,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    Loading,
    MatListModule,
    MatIconModule
  ],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order {
  flight = signal<FlightModel | null>(null)
  airlines = DataService.getAirlines()
  seatingTypes = DataService.getSeatingTypes()

  order: Partial<OrderModel> = {
    airlineId: this.airlines[0].id,
    seatingTypeId: this.seatingTypes[0].id,
    ageGroup: 'a',
    count: 1
  }

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    public utils: Utils
  ) {
    if (!AuthService.getActiveUser()) {
      this.router.navigate(['/login'])
      return
    }

    this.route.params.subscribe(params => {
      const id = Number(params['id'])
      FlightService.getFlightById(id)
        .then(rsp => {
          this.flight.set(rsp.data)
        })
    })
  }

  calculateTotal() {
    const seatingCost = this.seatingTypes.find((st) => st.id === this.order.seatingTypeId)!.price
    const airlineImpact = this.airlines.find((a) => a.id === this.order.airlineId)!.priceImpact
    return (seatingCost * airlineImpact * this.order.count!) / (this.order.ageGroup == 'c' ? 2 : 1)
  }

  placeOrder() {
    Alerts.confirm(`Are you sure you want to place the order for ${this.calculateTotal()} EUR?`, () => {
      AuthService.createOrder(this.order, this.flight()!)
      this.router.navigate(['/cart'])
    })
  }
}