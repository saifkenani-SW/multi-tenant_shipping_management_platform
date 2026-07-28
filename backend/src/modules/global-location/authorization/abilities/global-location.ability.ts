import { AbilityBuilder } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { ApplicationAbility } from '../../../../authorization/application-ability';
import {
  CaslAbilityContributor,
  CaslContributor,
} from '../../../../packages/authorization-casl';
import { Principal } from '../../../../packages/context/principal/principal/Principal';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { GlobalLocationAction } from '../actions/global-location.action';
import { GlobalLocationSubject } from '../subjects/global-location.subject';

/**
 * TODO: راجع هذه القواعد.
 *
 * الافتراض: المرجع الجغرافي مشترك بين كل الشركات، فتعديله يؤثر على
 * الجميع — لذلك الكتابة لمدير المنصة وحده. القراءة مفتوحة للجميع
 * (بما فيهم العميل) لأن اختيار مدينة أو منطقة جزء من إنشاء أي شحنة.
 */
@CaslContributor()
@Injectable()
export class GlobalLocationAbility implements CaslAbilityContributor<
  ApplicationAbility,
  Principal
> {
  contribute(
    builder: AbilityBuilder<ApplicationAbility>,
    principal: Principal,
  ): void {
    builder.can(GlobalLocationAction.View, GlobalLocationSubject);

    if (principal.subject.type === SubjectType.PLATFORM_ADMIN) {
      builder.can(GlobalLocationAction.Create, GlobalLocationSubject);
      builder.can(GlobalLocationAction.Update, GlobalLocationSubject);
      builder.can(GlobalLocationAction.Delete, GlobalLocationSubject);
    }
  }
}
