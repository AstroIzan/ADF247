import { NgModule } from '@angular/core';
import { ConvosComponent } from './convos.component';
import { ConvoTypesComponent } from './convo-types.component';

@NgModule({
  declarations: [],
  imports: [ConvosComponent, ConvoTypesComponent],
  exports: [ConvosComponent, ConvoTypesComponent]
})
export class ConvosModule { }
