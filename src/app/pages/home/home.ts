import { Component } from '@angular/core';
import { WizardComponent } from '../../components/wizard/wizard.component';


@Component({
  selector: 'app-home',
  imports: [WizardComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home { }
