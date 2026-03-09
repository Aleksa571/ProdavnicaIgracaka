import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DataService } from '../services/data.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { OrderModel } from '../../models/order.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Utils } from '../utils';
import { Alerts, matCustomClass } from '../alerts';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cart',
  imports: [MatCardModule, MatTableModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  airlines = DataService.getAirlines()
  types = DataService.getSeatingTypes()
  displayedColumns =
    ['destination', 'flightNumber', 'scheduledAt', 'airline', 'seatingType', 'ageGroup', 'count', 'options']

  constructor(public router: Router, public utils: Utils) {
    if (!AuthService.getActiveUser()) {
      router.navigate(['/login'])
      return
    }
  }

  reloadComponent() {
    this.router.navigateByUrl('/', { skipLocationChange: true })
      .then(() => {
        this.router.navigate(['/cart'])
      })
  }

  removeOrder(order: OrderModel) {
    Alerts.confirm(`Are you sure you want to remove ${order.count} ticket${order.count > 1 ? 's' : ''} for ${order.destination}?`, () => {
      AuthService.cancelOrder(order.createdAt)
      this.reloadComponent()
    })
  }

  payAll() {
    Alerts.confirm(`Are you sure you want to pay? Your total is ${this.calculateTotal()} EUR!`, () => {
      AuthService.payOrders()
      this.reloadComponent()
    })
  }

  calculateTotal() {
    let total = 0
    for (let order of this.getOrders()) {
      total += this.utils.calculateTotal(order)
    }

    return total
  }

  showBarcode(order: OrderModel) {
    const barcode = new Date(order.createdAt).getTime()
    const src = `https://quickchart.io/barcode?type=code128&text=${barcode}&width=280&includeText=true`
    Swal.fire({
      title: `${order.destination} (${order.flightNumber})`,
      customClass: matCustomClass,
      html: `<img src="${src}" />`,
    })
  }

  getOrders() {
    return AuthService.getOrdersByState('w')
  }

  getPaidOrders() {
    return AuthService.getOrdersByState('p')
  }

  getCanceledOrders() {
    return AuthService.getOrdersByState('c')
  }

  getAirline(order: OrderModel) {
    return DataService.getAirlineById(order.airlineId).name
  }

  getSeatingType(order: OrderModel) {
    return DataService.getSeatingTypeById(order.seatingTypeId).name
  }

  getAgeGroup(order: OrderModel) {
    return DataService.getFullAgeGroupText(order.ageGroup)
  }
}
 