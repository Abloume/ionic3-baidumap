import { Component } from '@angular/core';

import { BaiduPage } from '../baidu/baidu';
import { ContactPage } from '../contact/contact';
import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = BaiduPage;
  tab3Root = ContactPage;

  constructor() {

  }
}
