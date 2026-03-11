// Landing page search service
export interface SearchCriteria {
  dln?: string;
  nameControl?: string;
  tin?: string;
  taxpayerName?: string;
}

export interface ProgramSelection {
  program?: string;
  statusCode?: string;
  serviceCenter: string;
}

export interface SearchResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface SelectionResult {
  success: boolean;
  message?: string;
  data?: any;
}

class LandingSearchService {
  private baseUrl = '/api/era';

  /**
   * Search for records based on search criteria
   */
  async searchRecords(criteria: SearchCriteria): Promise<SearchResult> {
    try {
      
      // In a real implementation, this would make an HTTP request
      // For now, we'll simulate a successful search and store the criteria
      
      // Store search criteria in sessionStorage for use by other components
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('searchData', JSON.stringify(criteria));
        sessionStorage.setItem('searchType', 'enhanced');
        sessionStorage.setItem('landingSearchPerformed', 'true');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For demonstration, we'll always return success
      // In a real implementation, this would process the actual search
      return {
        success: true,
        message: 'Search completed successfully',
        data: {
          criteria,
          recordsFound: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to search records. Please try again.'
      };
    }
  }

  /**
   * Select program and service center for work assignment
   */
  async selectProgramAndServiceCenter(selection: ProgramSelection): Promise<SelectionResult> {
    try {
      
      // In a real implementation, this would make an HTTP request
      // For now, we'll simulate a successful selection and store the data
      
      // Store selection data in sessionStorage for use by other components
      if (typeof window !== 'undefined') {
        if (selection.program) {
          sessionStorage.setItem('selectedProgram', selection.program);
          sessionStorage.setItem('searchType', 'program');
        }
        if (selection.statusCode) {
          sessionStorage.setItem('selectedStatusCode', selection.statusCode);
          sessionStorage.setItem('searchType', 'statusCode');
        }
        sessionStorage.setItem('selectedServiceCenter', selection.serviceCenter);
        sessionStorage.setItem('landingSelectionPerformed', 'true');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // For demonstration, we'll always return success
      // In a real implementation, this would validate the selection and possibly assign work
      return {
        success: true,
        message: 'Selection completed successfully',
        data: {
          selection,
          workAssigned: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process selection. Please try again.'
      };
    }
  }

  /**
   * Get stored search data from session storage
   */
  getStoredSearchData(): SearchCriteria | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const searchData = sessionStorage.getItem('searchData');
      return searchData ? JSON.parse(searchData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get stored selection data from session storage
   */
  getStoredSelectionData(): ProgramSelection | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const program = sessionStorage.getItem('selectedProgram');
      const statusCode = sessionStorage.getItem('selectedStatusCode');
      const serviceCenter = sessionStorage.getItem('selectedServiceCenter');
      
      if (!serviceCenter) return null;
      
      return {
        program: program || undefined,
        statusCode: statusCode || undefined,
        serviceCenter
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the search type from session storage
   */
  getSearchType(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('searchType');
  }

  /**
   * Check if a landing search was performed
   */
  hasLandingSearchBeenPerformed(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('landingSearchPerformed') === 'true';
  }

  /**
   * Check if a landing selection was performed
   */
  hasLandingSelectionBeenPerformed(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('landingSelectionPerformed') === 'true';
  }

  /**
   * Clear all stored landing data
   */
  clearStoredData(): void {
    if (typeof window === 'undefined') return;
    
    const keysToRemove = [
      'searchData',
      'searchType',
      'selectedProgram',
      'selectedStatusCode',
      'selectedServiceCenter',
      'landingSearchPerformed',
      'landingSelectionPerformed'
    ];
    
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
  }

  /**
   * Validate DLN format
   */
  validateDLN(dln: string): boolean {
    const cleanDLN = dln.replace(/\D/g, '');
    return cleanDLN.length === 17 && /^\d{17}$/.test(cleanDLN);
  }

  /**
   * Validate TIN format (SSN or EIN)
   */
  validateTIN(tin: string): boolean {
    const cleanTIN = tin.replace(/\D/g, '');
    return /^\d{9}$/.test(cleanTIN);
  }

  /**
   * Validate Name Control format
   */
  validateNameControl(nameControl: string): boolean {
    return nameControl.length <= 4 && /^[A-Z]*$/.test(nameControl);
  }

  /**
   * Format DLN input
   */
  formatDLN(value: string): string {
    let cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length > 17) {
      cleanValue = cleanValue.substring(0, 17);
    }
    return cleanValue;
  }

  /**
   * Format TIN input with dashes
   */
  formatTIN(value: string): string {
    let cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 9) {
      // Format as SSN: XXX-XX-XXXX
      if (cleanValue.length >= 6) {
        cleanValue = cleanValue.replace(/(\d{3})(\d{2})(\d{0,4})/, '$1-$2-$3');
      } else if (cleanValue.length >= 4) {
        cleanValue = cleanValue.replace(/(\d{3})(\d{0,2})/, '$1-$2');
      }
    } else {
      // Format as EIN: XX-XXXXXXX
      cleanValue = cleanValue.substring(0, 9);
      cleanValue = cleanValue.replace(/(\d{2})(\d{0,7})/, '$1-$2');
    }
    return cleanValue;
  }

  /**
   * Format Name Control input
   */
  formatNameControl(value: string): string {
    return value.toUpperCase().substring(0, 4);
  }
}

// Export singleton instance
export const landingSearchService = new LandingSearchService();
