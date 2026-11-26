import { expect, Page, test } from '@playwright/test';
import { flightSearchData } from '../data/flight-search.data';
import { FlightSearchPage } from '../pages/FlightSearchPage';

const calendarMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const calendarWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fullWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseCalendarDate(dateLabel: string): Date {
  const date = /^[A-Za-z]{3} ([A-Za-z]{3}) (\d{1,2}) (\d{4})$/.exec(dateLabel);
  if (!date) {
    throw new Error(`Unexpected departure calendar date: ${dateLabel}`);
  }

  const month = calendarMonths.indexOf(date[1]);
  if (month === -1) {
    throw new Error(`Unexpected departure month: ${date[1]}`);
  }

  return new Date(Date.UTC(Number(date[3]), month, Number(date[2])));
}

function calendarDateLabel(date: Date): string {
  return `${calendarWeekdays[date.getUTCDay()]} ${calendarMonths[date.getUTCMonth()]} ${date.getUTCDate()} ${date.getUTCFullYear()}`;
}

function expectedSearchUrl(departureDate: string): RegExp {
  const { originCode, destinationCode } = flightSearchData.validRoute;
  const date = parseCalendarDate(departureDate);
  const formattedDate = `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
  return new RegExp(
    `/flight/search\\?itinerary=${originCode}-${destinationCode}-${formattedDate}`,
  );
}

function expectedDepartureDisplay(dateLabel: string): string {
  const date = parseCalendarDate(dateLabel);
  return `${date.getUTCDate()} ${calendarMonths[date.getUTCMonth()]}${String(date.getUTCFullYear()).slice(-2)}`;
}

function expectedRouteSearchUrl(): RegExp {
  const { originCode, destinationCode } = flightSearchData.validRoute;
  return new RegExp(
    `/flight/search\\?itinerary=${originCode}-${destinationCode}-\\d{2}/\\d{2}/\\d{4}`,
  );
}

async function verifyDefaultSearchForm(flightSearchPage: FlightSearchPage): Promise<string> {
  await flightSearchPage.open();
  await expect(flightSearchPage.originSelector).toContainText(
    flightSearchData.validRoute.originCode,
  );
  await expect(flightSearchPage.destinationSelector).toContainText(
    flightSearchData.validRoute.destinationCode,
  );
  await expect(flightSearchPage.departureDateInput).toHaveValue(
    /^[A-Za-z]+, \d{1,2} [A-Za-z]{3} \d{4}$/,
  );

  await flightSearchPage.openDepartureCalendar();
  const selectedDate = await flightSearchPage.getSelectedDepartureDate();
  await flightSearchPage.selectDepartureDate(selectedDate);
  return selectedDate;
}

async function submitDefaultOneWaySearch(page: Page): Promise<string> {
  const flightSearchPage = new FlightSearchPage(page);
  const departureDate = await verifyDefaultSearchForm(flightSearchPage);
  await flightSearchPage.searchCurrentRoute();
  return departureDate;
}

test.describe('MakeMyTrip flight search', () => {
  test('[FS-001] submits the displayed one-way route and departure date', async ({ page }) => {
    const departureDate = await submitDefaultOneWaySearch(page);
    await expect(page).toHaveURL(expectedSearchUrl(departureDate));
  });

  test('[FS-002] renders flight results for the selected one-way route', async ({ page }) => {
    await submitDefaultOneWaySearch(page);

    await expect(page).toHaveURL(expectedRouteSearchUrl());
    await expect(page.getByText(flightSearchData.validRoute.originName, { exact: true })).toBeVisible();
    await expect(page.getByText(flightSearchData.validRoute.destinationName, { exact: true })).toBeVisible();
  });

  test(
    '[FS-003] receives a successful flight-search navigation response',
    async ({ page }, testInfo) => {
      const flightSearchPage = new FlightSearchPage(page);
      await verifyDefaultSearchForm(flightSearchPage);

      const responsePromise = page.waitForResponse((response) => {
        const request = response.request();
        const responseUrl = new URL(response.url());

        return (
          request.isNavigationRequest() &&
          request.frame() === page.mainFrame() &&
          responseUrl.pathname === '/flight/search'
        );
      });

      await flightSearchPage.searchCurrentRoute();
      const response = await responsePromise;
      await page.waitForLoadState('domcontentloaded');

      const contentType = response.headers()['content-type'] ?? 'missing';
      const visibleBody = (await page.locator('body').innerText()).slice(0, 500);
      const diagnostic = [
        `Path: ${new URL(response.url()).pathname}`,
        `Status: ${response.status()}`,
        `Content-Type: ${contentType}`,
        `Visible document text: ${visibleBody}`,
      ].join('\n');

      await testInfo.attach('flight-search-navigation-response.txt', {
        body: diagnostic,
        contentType: 'text/plain',
      });

      expect(response.ok(), 'Flight-search navigation should return a successful HTTP status').toBe(true);
    },
  );

  test('[FS-004] does not offer an airport suggestion for an unknown origin', async ({ page }) => {
    const flightSearchPage = new FlightSearchPage(page);
    await flightSearchPage.open();
    await flightSearchPage.searchOrigin(flightSearchData.unknownOrigin);

    await expect(
      page.getByRole('listitem', { name: flightSearchData.unknownOrigin, exact: true }),
    ).toHaveCount(0);
  });

  test('[FS-005] accepts the observed maximum of nine adult travellers', async ({ page }) => {
    const flightSearchPage = new FlightSearchPage(page);
    await flightSearchPage.open();
    await flightSearchPage.selectAdultCount(flightSearchData.maximumAdultCount);

    await expect(page.getByRole('button', { name: /^Travellers 9 9 Adults/ })).toBeVisible();
  });

  test('[FS-006] updates the departure field after selecting a calendar date', async ({ page }) => {
    const flightSearchPage = new FlightSearchPage(page);
    await flightSearchPage.open();
    await expect(flightSearchPage.departureDateInput).toHaveValue(
      /^[A-Za-z]+, \d{1,2} [A-Za-z]{3} \d{4}$/,
    );
    await flightSearchPage.openDepartureCalendar();

    const selectedDate = parseCalendarDate(await flightSearchPage.getSelectedDepartureDate());
    selectedDate.setUTCDate(selectedDate.getUTCDate() + 1);
    const nextDateLabel = calendarDateLabel(selectedDate);
    await flightSearchPage.selectDepartureDate(nextDateLabel);

    await expect(flightSearchPage.departureDateDisplay).toHaveText(
      expectedDepartureDisplay(nextDateLabel),
    );
    await expect(flightSearchPage.departureWeekdayDisplay).toHaveText(
      fullWeekdays[selectedDate.getUTCDay()],
    );
  });

  test('[FS-007] selects origin and destination airport suggestions', async ({ page }) => {
    const flightSearchPage = new FlightSearchPage(page);
    await flightSearchPage.open();

    const { origin, destination } = flightSearchData.airportSelection;
    await flightSearchPage.selectOrigin(origin.query, origin.code);
    await expect(flightSearchPage.originSelector).toContainText(origin.code);
    await flightSearchPage.selectDestination(destination.query, destination.code);
    await expect(flightSearchPage.destinationSelector).toContainText(destination.code);
  });

  test('[FS-008] directs groups above nine adults to the group-booking flow', async ({ page }) => {
    const flightSearchPage = new FlightSearchPage(page);
    await flightSearchPage.open();
    await flightSearchPage.selectMoreThanNineAdults();

    await expect(page.getByRole('textbox', { name: /^Travellers/ })).toHaveValue('10');
    await expect(
      page
        .getByText('Save on bookings with more than 9 travellers', { exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
  });

  test('[FS-009] does not select a disabled past departure date', async ({ page }) => {
    const flightSearchPage = new FlightSearchPage(page);
    await flightSearchPage.open();
    await flightSearchPage.openDepartureCalendar();

    const selectedDate = await flightSearchPage.getSelectedDepartureDate();
    const latestDisabledDate = flightSearchPage.disabledDepartureDates.last();
    await expect(latestDisabledDate).toHaveAttribute('aria-disabled', 'true');
    await latestDisabledDate.click();

    await expect(page.getByRole('gridcell', { selected: true })).toHaveAttribute(
      'aria-label',
      selectedDate,
    );
  });
});
