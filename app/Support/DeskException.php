<?php

namespace App\Support;

use RuntimeException;

class DeskException extends RuntimeException
{
    public function __construct(string $message, public int $status = 400)
    {
        parent::__construct($message);
    }
}
