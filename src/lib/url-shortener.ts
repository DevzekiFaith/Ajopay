/**
 * URL Shortening Service
 * Provides multiple fallback options for creating short URLs
 */

export interface ShortUrlResult {
  shortUrl: string;
  service: string;
  success: boolean;
  error?: string;
}

/**
 * Generate a short URL using multiple services with fallbacks
 */
export async function generateShortUrl(longUrl: string): Promise<ShortUrlResult> {
  // Try TinyURL first (most reliable)
  try {
    const tinyUrlResult = await generateTinyURL(longUrl);
    if (tinyUrlResult.success) {
      return tinyUrlResult;
    }
  } catch (error) {
    console.log('TinyURL failed, trying alternatives...');
  }

  // Try alternative services
  try {
    const isGdResult = await generateIsGdUrl(longUrl);
    if (isGdResult.success) {
      return isGdResult;
    }
  } catch (error) {
    console.log('is.gd failed, trying alternatives...');
  }

  // Try v.gd as final fallback
  try {
    const vGdResult = await generateVGdUrl(longUrl);
    if (vGdResult.success) {
      return vGdResult;
    }
  } catch (error) {
    console.log('v.gd failed, using original URL');
  }

  // Return original URL if all services fail
  return {
    shortUrl: longUrl,
    service: 'original',
    success: false,
    error: 'All URL shortening services failed'
  };
}

/**
 * Generate short URL using TinyURL
 */
async function generateTinyURL(longUrl: string): Promise<ShortUrlResult> {
  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (response.ok) {
      const shortUrl = await response.text();
      
      // TinyURL returns the short URL or an error message
      if (shortUrl.startsWith('http')) {
        return {
          shortUrl,
          service: 'tinyurl',
          success: true
        };
      } else {
        throw new Error(shortUrl);
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    return {
      shortUrl: longUrl,
      service: 'tinyurl',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate short URL using is.gd
 */
async function generateIsGdUrl(longUrl: string): Promise<ShortUrlResult> {
  try {
    const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (response.ok) {
      const shortUrl = await response.text();
      
      if (shortUrl.startsWith('http')) {
        return {
          shortUrl,
          service: 'is.gd',
          success: true
        };
      } else {
        throw new Error(shortUrl);
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    return {
      shortUrl: longUrl,
      service: 'is.gd',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate short URL using v.gd
 */
async function generateVGdUrl(longUrl: string): Promise<ShortUrlResult> {
  try {
    const response = await fetch(`https://v.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (response.ok) {
      const shortUrl = await response.text();
      
      if (shortUrl.startsWith('http')) {
        return {
          shortUrl,
          service: 'v.gd',
          success: true
        };
      } else {
        throw new Error(shortUrl);
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    return {
      shortUrl: longUrl,
      service: 'v.gd',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a branded short URL for AjoPay
 * This creates a more professional-looking short URL
 */
export async function generateBrandedShortUrl(longUrl: string, customAlias?: string): Promise<ShortUrlResult> {
  // For now, we'll use the regular short URL generation
  // In the future, you could integrate with services that support custom domains
  // like bit.ly, short.io, or your own URL shortening service
  
  const result = await generateShortUrl(longUrl);
  
  // Add branding info to the result
  return {
    ...result,
    service: result.service === 'original' ? 'original' : `${result.service} (branded)`
  };
}

/**
 * Validate if a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the domain from a URL for display purposes
 */
export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'Invalid URL';
  }
}
