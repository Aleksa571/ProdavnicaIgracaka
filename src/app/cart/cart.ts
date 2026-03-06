import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DataService } from '../services/data.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-cart',
  imports: [MatCardModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  airlines = DataService.getAirlines()
  types = DataService.getSeatingTypes()

  constructor(public router: Router) {
    if (!AuthService.getActiveUser()) {
      router.navigate(['/login'])
      return
    }
  }

  getOrders() {
    return AuthService.getOrdersOnWaiting()
  }
}