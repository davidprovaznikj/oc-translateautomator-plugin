<?php namespace DavidProvaznik\TranslateAutomator\Models;

use Model;
use Stichoza\GoogleTranslate\GoogleTranslate;
use Log;
use Exception;

class TranslateAutomator extends Model
{
    public static function autoTranslate($text, $sourceLocale, $targetLocale): ?string
    {
        try {
            $tr = new GoogleTranslate();
            $tr->setSource($sourceLocale);
            $tr->setTarget($targetLocale);

            $translatedText = $tr->translate($text);

            return $translatedText;
        } catch (Exception $e) {
            Log::error('Google Translate API error: ' . $e->getMessage());
            throw new Exception("Error communicating with Google Translate API: " . $e->getMessage());
        }
    }
}
