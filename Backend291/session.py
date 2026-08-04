# ==========================================
# In-Memory Chat Sessions
# Simple process-local store - fine for a single backend
# instance. Swap for Redis/DB if you scale to multiple workers.
# ==========================================

import uuid

_SESSIONS = {}


def new_session():

    sid = str(uuid.uuid4())

    _SESSIONS[sid] = {
        "history": []
    }

    return sid


def get_session(session_id):

    return _SESSIONS.get(session_id)


def get_or_create(session_id):

    if session_id and session_id in _SESSIONS:
        return session_id

    return new_session()


def add_message(session_id, role, content):

    session = _SESSIONS.get(session_id)

    if session is None:
        return

    session["history"].append({
        "role": role,
        "content": content
    })

    # Keep it bounded - clarify stage never needs more than
    # the last few turns of back-and-forth.
    session["history"] = session["history"][-12:]


def get_history(session_id):

    session = _SESSIONS.get(session_id)

    return session["history"] if session else []
