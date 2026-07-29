import React from 'react'
import { I } from '../components/icons.jsx'
import { Card } from '../components/ui.jsx'
import { EmptyState } from '../components/feedback.jsx'

// page-support.jsx — Support tickets
// No ticketing backend exists yet — this used to show fabricated sample
// tickets/conversations as if they were real account history, which is
// worse than an empty state, so it's been replaced with an honest one.

function PageSupport({ onGo }) {
  return (
    <div>
      <div className="page-h">
        <div>
          <h1>Support</h1>
          <div className="sub">Not available yet</div>
        </div>
      </div>

      <Card>
        <EmptyState
          icon={<I.megaphone size={28}/>}
          title="Support isn't available yet"
          body="Ticketing hasn't been built out in this build. Reach out through your usual channel for now."
        />
      </Card>
    </div>
  );
}

export { PageSupport }
