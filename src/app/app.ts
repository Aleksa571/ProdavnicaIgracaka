import { Component } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLinkWithHref,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public authService = AuthService

  constructor(private router: Router) {}

  doLogout() {
    AuthService.logout()
    this.router.navigate(['/login'])
  }
}