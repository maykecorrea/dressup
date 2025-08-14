# Migration from Gemini API to OpenAI Image API

This document describes the migration from Google's Genkit AI (Gemini) to OpenAI's Image Generation API.

## Changes Made

### Dependencies
- **Removed**: `@genkit-ai/googleai`, `@genkit-ai/next`, `genkit`, `genkit-cli`
- **Added**: `openai`

### Configuration
- Replaced `src/ai/genkit.ts` with `src/ai/openai.ts`
- New OpenAI client configuration using `OPENAI_API_KEY` environment variable

### AI Flows
- Updated `generate-virtual-dress-up.ts` to use OpenAI's `images.edit()` API
- Updated `enhance-virtual-dress-up-positive-prompts.ts` to use OpenAI API
- Updated `enhance-virtual-dress-up-negative-prompts.ts` to use OpenAI API

### Utility Functions
- Added `src/ai/utils.ts` with helper functions for:
  - Converting data URIs to temporary files
  - Converting base64 data to data URIs
  - Handling multiple image files

### Key Technical Changes

#### API Differences
- **Gemini**: Used Genkit's `ai.generate()` with multi-modal prompts
- **OpenAI**: Uses `client.images.edit()` with file streams and text prompts

#### Image Handling
- **Gemini**: Direct data URI support in multi-modal prompts
- **OpenAI**: Requires File objects, so we convert data URIs to buffers and create File objects
- **Multi-image approach**: Sequential processing for accessories rather than simultaneous to ensure compatibility

#### Model Configuration
- **Gemini**: `googleai/gemini-2.0-flash-preview-image-generation`
- **OpenAI**: `gpt-image-1` with additional parameters:
  - `size: "1024x1024"`
  - `quality: "high"`
  - `input_fidelity: "high"`

#### Error Handling
- Added proper null checks for API responses
- Enhanced error messages and logging
- Graceful degradation for accessory processing (if one fails, continues with current result)

## Environment Configuration

Add to your `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## API Features Supported

The migration maintains all existing functionality:
- Multi-step dress-up process (main garment + accessories)
- Multiple clothing items support (pants, shoes, necklaces, cold weather items)
- Positive and negative prompt enhancement
- Custom style prompts
- High-quality image generation

## Usage Notes

- The API maintains the same input/output interface for compatibility
- Data URIs are automatically converted to the format required by OpenAI
- Temporary files are created and cleaned up automatically
- Error handling includes both OpenAI API errors and file system errors
