<?php

namespace App\Policies;

use App\Models\Profile;

class ProfilePolicy
{
    public function view(Profile $actor, Profile $profile): bool
    {
        return $actor->isAdmin() || $actor->is($profile);
    }

    public function update(Profile $actor, Profile $profile): bool
    {
        return $actor->isAdmin() || $actor->is($profile);
    }

    public function manageVerification(Profile $actor): bool
    {
        return $actor->isAdmin();
    }
}
