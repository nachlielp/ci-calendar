```
rules_version = '2';

service cloud.firestore {
    match / databases / { database } / documents {
        match / events / { eventId } {
      allow read: if true;
      
      allow create: if request.auth != null && isTeacherOrAdmin(request.auth.uid);
      
      allow update: if request.auth != null &&
                (
                    resource.data.creatorId == request.auth.uid || isAdmin(request.auth.uid)
                );
      
      allow delete: if request.auth != null &&
                (
                    resource.data.creatorId == request.auth.uid || isAdmin(request.auth.uid)
                );

            function isTeacherOrAdmin(userId) {
                return get(/databases/$(database) / documents / users / $(userId)).data.userType in ['teacher', 'admin'];
            }

            function isAdmin(userId) {
                return get(/databases/$(database) / documents / users / $(userId)).data.userType == 'admin';
            }
        }
    }


    match / databases / { database } / documents {
        match / users / { usersId } {
    
      allow read: if request.auth != null &&
                (resource.data.id == request.auth.uid || isAdmin(request.auth.uid));
      
      allow write: if request.auth != null &&
                (resource.data.id == request.auth.uid || isAdmin(request.auth.uid));

            function isAdmin(userId) {
                return get(/databases/$(database) / documents / users / $(userId)).data.userType == 'admin';
            }
        }
    }

    match / databases / { database } / documents{
        match / teachers / { teacherId }{
    		allow read: if true;
        allow write: if request.auth != null &&
                (resource.data.id == request.auth.uid || isAdmin(request.auth.uid));
        }
        function isAdmin(userId) {
            return get(/databases/$(database) / documents / users / $(userId)).data.userType == 'admin';
        }
    }
}
