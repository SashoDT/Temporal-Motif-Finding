import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-result-page',
  standalone: true,
  imports: [],
  templateUrl: './result-page.component.html',
  styleUrl: './result-page.component.css'
})
export class ResultPageComponent implements OnInit {
  searchData: any; // Adjust types as per your data structure

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.searchData = history.state.data; // Access state data
    console.clear();
    console.log(this.searchData);
    // Handle how you want to use searchData in your component
  }
}
