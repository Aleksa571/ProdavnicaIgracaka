
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './services/auth.service';
import { ToyService } from './services/toy.service';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLinkWithHref,
    RouterLinkActive,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  public authService = AuthService
  private refreshSignal = signal(0)
  
  userDisplayName = computed(() => {
    this.refreshSignal()
    const user = AuthService.getActiveUser()
    if (!user) return ''
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    } else if (user.firstName) {
      return user.firstName
    } else if (user.email) {
      return user.email.split('@')[0]
    }
    return 'Korisnik'
  })

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshSignal.set(Date.now())
      })
  }

  ngOnInit() {
    this.refreshSignal.set(Date.now())
  }

  doLogout() {
    AuthService.logout()
    this.refreshSignal.set(Date.now())
    this.router.navigate(['/login'])
  }

  getUserDisplayName(): string {
    return this.userDisplayName()
  }
}
