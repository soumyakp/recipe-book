import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { AuthService } from './auth/auth.service';
import { AutoLogin } from './auth/store/auth.action';
import { LoggingService } from './logging.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private store: Store, private loggingService: LoggingService) {}

  ngOnInit() {
    this.store.dispatch(new AutoLogin());
    this.loggingService.printLog('Hello from AppComponent ngOnInit');
  }
}
