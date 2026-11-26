# MakeMyTrip Flight Search – Test Strategy and Test Cases

## 1. Objective

The objective is to validate the MakeMyTrip flight-search functionality through automated UI testing using Playwright and TypeScript.

focuses on validating flight search, airport selection, departure-date selection, passenger selection, input validation and expected application behavior.

## 2. Automation Tool and Framework

- **Application:** MakeMyTrip
- **Automation tool:** Playwright
- **Programming language:** TypeScript
- **Test framework:** Playwright Test
- **Design pattern:** Page Object Model (POM)
- **Browser:** Chromium
- **Reporting:** Playwright HTML Report

## 3. Test Scope

### In Scope

- Loading the flight-search page.
- Valid one-way flight search.
- Origin and destination airport selection.
- Airport autocomplete suggestions.
- Invalid origin search.
- Departure-date selection.
- Passenger-count selection.
- Maximum adult passenger boundary.
- Group-booking behavior for more than nine adults.
- Restriction on selecting past departure dates.
- Flight-search navigation response validation.

### Out of Scope

- User registration and login.
- Payment processing.
- Actual ticket booking and cancellation.
- Refund processing.
- Post-booking notifications.
- End-to-end payment gateway integration.

These areas are outside the current implemented automation coverage.

## 4. Test Strategy

The testing approach combines positive, negative, boundary and technical validation scenarios.

**Positive testing:** Verify that users can select valid airports, update departure dates, select passengers and submit a valid one-way search.

**Negative testing:** Verify that invalid airport input does not produce an airport suggestion and past departure dates cannot be selected.

**Boundary testing:** Validate the maximum supported adult passenger count of nine and the behavior when selecting more than nine adults.

**Technical validation:** Verify the flight-search navigation response and its content type.

### Execution Approach

1. Launch the MakeMyTrip flight-search page.
2. Handle the login prompt if it appears.
3. Perform the required user interactions.
4. Validate the application using Playwright assertions.
5. Execute tests in Chromium.
6. Review failed tests, execution traces and HTML reports.

## 5. Test Prioritization and Rationale

| Priority | Test cases | Rationale |
|---|---|---|
| High | FS-001, FS-002, FS-007 | Flight search and airport selection are core user journeys. |
| High | FS-004, FS-009 | Invalid airport input and past-date restrictions help prevent incorrect searches. |
| High | FS-005, FS-008 | Passenger limits and group-booking behavior affect booking eligibility. |
| Medium | FS-006 | Departure-date selection is essential to search accuracy. |
| Medium | FS-003 | Validates the technical response received during search navigation. |

## 6. Test Cases

### FS-001 – Submit a valid one-way flight search

**Priority:** High  
**Type:** Positive

**Precondition:** MakeMyTrip flight-search page is accessible.

**Test Data:** New Delhi (DEL) to Bengaluru (BLR).

**Steps:**
1. Open the flight-search page.
2. Verify the displayed origin and destination.
3. Verify the departure date.
4. Submit the flight search.

**Expected Result:**
The application should navigate to the flight-search results URL with the selected route and departure date.

### FS-002 – Verify flight results for the selected route

**Priority:** High  
**Type:** Positive

**Precondition:** Valid one-way flight search is available.

**Test Data:** New Delhi (DEL) to Bengaluru (BLR).

**Steps:**
1. Open the flight-search page.
2. Submit the default one-way flight search.
3. Verify the resulting URL.
4. Verify the origin and destination names on the results page.

**Expected Result:**
The application should navigate to the results page and display the selected origin and destination.

### FS-003 – Validate flight-search navigation response

**Priority:** Medium  
**Type:** Technical validation

**Steps:**
1. Open the flight-search page.
2. Prepare to capture the main-frame navigation response.
3. Submit the flight search.
4. Capture the response status and content type.

**Expected Result:**
The navigation should return a successful HTTP response with an HTML document content type.

### FS-004 – Search using an unknown origin

**Priority:** High  
**Type:** Negative

**Test Data:** NoSuchAirportXYZ.

**Steps:**
1. Open the flight-search page.
2. Select the origin field.
3. Enter an unknown airport name.
4. Check the airport suggestion list.

**Expected Result:**
No matching airport suggestion should be displayed for the invalid origin.

### FS-005 – Select the maximum supported adult passenger count

**Priority:** High  
**Type:** Boundary

**Test Data:** 9 adults.

**Steps:**
1. Open the flight-search page.
2. Open the traveller selection panel.
3. Select nine adults.
4. Verify the traveller selection.

**Expected Result:**
The traveller selector should display nine adults.

### FS-006 – Update the departure date

**Priority:** Medium  
**Type:** Positive

**Steps:**
1. Open the flight-search page.
2. Open the departure calendar.
3. Identify the currently selected departure date.
4. Select the following date.
5. Verify the departure date and weekday.

**Expected Result:**
The departure field should display the newly selected date and the corresponding weekday.

### FS-007 – Select origin and destination airport suggestions

**Priority:** High  
**Type:** Positive

**Test Data:**
- Origin: Mumbai (BOM).
- Destination: Bengaluru (BLR).

**Steps:**
1. Open the flight-search page.
2. Select the origin field.
3. Search for Mumbai.
4. Select the BOM suggestion.
5. Select the destination field.
6. Search for Bengaluru.
7. Select the BLR suggestion.

**Expected Result:**
The origin and destination fields should display the selected airport codes.

### FS-008 – Select more than nine adults

**Priority:** High  
**Type:** Boundary

**Steps:**
1. Open the flight-search page.
2. Open the traveller selection panel.
3. Select the more-than-nine-adults option.
4. Verify the passenger count and group-booking message.

**Expected Result:**
The application should display ten in the traveller field and show the group-booking message.

### FS-009 – Verify past departure dates cannot be selected

**Priority:** High  
**Type:** Negative

**Steps:**
1. Open the flight-search page.
2. Open the departure calendar.
3. Identify a disabled past date.
4. Attempt to select the disabled date.
5. Verify the currently selected date.

**Expected Result:**
The past date should remain disabled, and the previously selected departure date should remain selected.

## 7. Execution and Reporting

Automated tests are executed using Playwright Test in Chromium.

The HTML report provides execution results, while failure traces and diagnostic attachments help investigate unsuccessful scenarios.

Test results should be reviewed and any failures documented accurately rather than treated as successful executions.

## 8. Conclusion

The current automation suite covers nine scenarios focused on the MakeMyTrip flight-search journey, including positive, negative, boundary and technical validation.

The strategy prioritizes critical user interactions and input validation while keeping payment and post-booking functionality outside the current assessment scope.