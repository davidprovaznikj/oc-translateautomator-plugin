<?php namespace DavidProvaznik\TranslateAutomator;

use RainLab\Translate\Classes\Locale;
use System\Classes\PluginBase;
use Event;
use Input;
use Response;
use DavidProvaznik\TranslateAutomator\Models\TranslateAutomator as HelperModel;

class Plugin extends PluginBase
{
    /** @var string[] $require Required plugins. */
    public $require = [
        'Rainlab.Translate',
    ];
    public function pluginDetails()
    {
        return [
            'name'        => 'Translate Automator',
            'description' => 'Automate translation of untranslated strings using Google Translate.',
            'author'      => 'David Provaznik',
            'icon'        => 'icon-language'
        ];
    }

    public function boot()
    {
        // Extend the view to add custom button
        Event::listen('backend.page.beforeDisplay', function($controller, $action, $params) {
            if ($controller instanceof \RainLab\Translate\Controllers\Messages && $action == 'index') {
                $controller->addJs('/plugins/davidprovaznik/translateautomator/assets/js/translateautomator.js');
                $controller->addCss('/plugins/davidprovaznik/translateautomator/assets/css/translateautomator.css');
                $controller->addDynamicMethod('onTranslate', function() {
                    $text = Input::get('text');
                    $localeTo = Input::get('locale_to');
                    $defaultLocale = Locale::getDefaultSiteLocale();

                    $translatedText = HelperModel::autoTranslate($text, $defaultLocale, $localeTo);

                    return Response::json(['translatedText' => $translatedText]);
                });
            }
        });
    }
}
