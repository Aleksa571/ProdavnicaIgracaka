import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [],
  templateUrl: './details.html',
  styleUrls: ['./details.css'],
})
export class Details {
  id = signal<any>(null)

  constructor(route: ActivatedRoute) {
    route.params.subscribe((params: any) => {
      console.log(params);
      this.id.set(params['id']);
    });
  }
}
 