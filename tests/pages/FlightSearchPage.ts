import { Locator, Page } from '@playwright/test';

export class FlightSearchPage {
  readonly page: Page;
  readonly originSelector: Locator;
  readonly destinationSelector: Locator;
  readonly loginPrompt: Locator;
  readonly loginPromptClose: Locator;
  readonly searchButton: Locator;
  readonly travellersSelector: Locator;
  readonly flightFormHeading: Locator;
  readonly departureDateSelector: Locator;
  readonly departureDateInput: Locator;
  readonly departureDateDisplay: Locator;
  readonly departureWeekdayDisplay: Locator;
  readonly disabledDepartureDates: Locator;

  constructor(page: Page) {
    this.page = page;
    this.originSelector = page.getByRole('button', { name: /^From/ }).nth(1);
    this.destinationSelector = page.getByRole('button', { name: /^To/ });
    this.loginPrompt = page.locator('section.modalMain');
    this.loginPromptClose = this.loginPrompt.locator('span.commonModal__close');
    this.searchButton = page.getByRole('button', { name: /^search$/i });
    this.travellersSelector = page.getByRole('button', { name: /^Travellers/ });
    this.flightFormHeading = page.getByRole('heading', {
      name: 'Book Domestic & International Flights',
    });
    this.departureDateSelector = page.getByRole('button', { name: /^Departure/ });
    this.departureDateInput = page.getByRole('textbox', { name: /^Departure/ });
    this.departureDateDisplay = page.locator('[data-cy="departureDate"]');
    this.departureWeekdayDisplay = page.locator('[data-cy="departureDay"]');
    this.disabledDepartureDates = page.locator('[role="gridcell"][aria-disabled="true"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/flights/', { waitUntil: 'domcontentloaded' });
    await this.flightFormHeading.waitFor({ state: 'visible' });
    await this.dismissLoginPromptIfVisible();
    await this.searchButton.waitFor({ state: 'visible' });
  }

  async dismissLoginPromptIfVisible(): Promise<void> {
    if (!(await this.loginPrompt.isVisible())) {
      return;
    }

    await this.page.keyboard.press('Escape');

    if (await this.loginPrompt.isVisible()) {
      if (!(await this.loginPromptClose.isVisible())) {
        throw new Error('The login prompt remained visible and has no visible close control.');
      }

      await this.loginPromptClose.click();
    }

    await this.loginPrompt.waitFor({ state: 'hidden' });
  }

  async searchCurrentRoute(): Promise<void> {
    await this.searchButton.click();
  }

  async openDepartureCalendar(): Promise<void> {
    await this.departureDateSelector.click();
  }

  async getSelectedDepartureDate(): Promise<string> {
    const selectedDate = this.page.getByRole('gridcell', { selected: true });
    const label = await selectedDate.getAttribute('aria-label');
    if (!label) {
      throw new Error('The departure calendar has no selected date label.');
    }

    return label;
  }

  async selectDepartureDate(dateLabel: string): Promise<void> {
    await this.page.getByRole('gridcell', { name: dateLabel, exact: true }).click();
  }

  async searchOrigin(origin: string): Promise<void> {
    await this.originSelector.click();
    await this.page.getByPlaceholder('From', { exact: true }).fill(origin);
  }

  async selectOrigin(searchTerm: string, airportCode: string): Promise<void> {
    await this.selectAirportSuggestion(this.originSelector, 'From', searchTerm, airportCode);
  }

  async selectDestination(searchTerm: string, airportCode: string): Promise<void> {
    await this.selectAirportSuggestion(
      this.destinationSelector,
      'To',
      searchTerm,
      airportCode,
    );
  }

  async selectAdultCount(count: number): Promise<void> {
    await this.travellersSelector.click();

    const option = this.page
      .getByRole('listitem')
      .filter({ hasText: new RegExp(`^\\s*\\u200e?${count}\\s*$`) });
    await option.click();
  }

  async selectMoreThanNineAdults(): Promise<void> {
    await this.travellersSelector.click();
    await this.page.getByRole('listitem').filter({ hasText: '>9' }).click();
  }

  private async selectAirportSuggestion(
    selector: Locator,
    placeholder: string,
    searchTerm: string,
    airportCode: string,
  ): Promise<void> {
    await selector.click();
    await this.page.getByPlaceholder(placeholder, { exact: true }).fill(searchTerm);
    const option = this.page
      .getByRole('listbox')
      .last()
      .getByText(airportCode, { exact: true });
    await option.waitFor({ state: 'visible' });
    await option.click();
  }
}
